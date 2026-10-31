import os
import sys
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

# Ensure environment variables are loaded regardless of execution working directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(
            SUPABASE_URL,
            SUPABASE_KEY,
            options=ClientOptions(auto_refresh_token=False, persist_session=False)
        )
    except Exception as e:
        print(f"WARNING: Failed to initialize Supabase client in auth module: {e}")
else:
    print("WARNING: Supabase URL or Key missing in auth module.")

# HTTPBearer security scheme (auto_error=False allows optional auth handling)
security = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "citizen"
    full_name: Optional[str] = None
    department: Optional[str] = None


async def verify_supabase_token(token: str) -> AuthenticatedUser:
    """
    Verifies a Supabase JWT token against the Supabase Auth service
    and retrieves the user's role and profile.
    """
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase is not configured on the backend"
        )

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        user = user_response.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Fetch user profile to extract authorization role
    role = "citizen"
    full_name = None
    department = None

    try:
        profile_res = (
            supabase.table("profiles")
            .select("id, role, full_name, department")
            .eq("id", user.id)
            .maybe_single()
            .execute()
        )
        if profile_res and profile_res.data:
            role = profile_res.data.get("role") or "citizen"
            full_name = profile_res.data.get("full_name")
            department = profile_res.data.get("department")
        elif user.user_metadata:
            role = user.user_metadata.get("role", "citizen")
            full_name = user.user_metadata.get("full_name")
    except Exception:
        if user.user_metadata:
            role = user.user_metadata.get("role", "citizen")
            full_name = user.user_metadata.get("full_name")

    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        role=role or "citizen",
        full_name=full_name,
        department=department
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthenticatedUser:
    """
    Dependency that enforces valid authentication.
    Raises HTTP 401 if token is absent, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return await verify_supabase_token(credentials.credentials)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthenticatedUser]:
    """
    Dependency for endpoints supporting both authenticated users and guests.
    Returns AuthenticatedUser if token is provided and valid; returns None if header is absent.
    Raises HTTP 401 if a token is provided but invalid/expired.
    """
    if not credentials or not credentials.credentials:
        return None
    return await verify_supabase_token(credentials.credentials)


def require_roles(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies that the authenticated user possesses one of the allowed roles.
    Raises HTTP 403 Forbidden if the user lacks the required role.
    """
    async def role_checker(
        current_user: AuthenticatedUser = Depends(get_current_user)
    ) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Insufficient privileges. Required role in {allowed_roles}, but found '{current_user.role}'."
            )
        return current_user
    return role_checker


# Predefined RBAC dependencies
require_admin_or_dispatcher = require_roles(["admin", "dispatcher"])
require_admin = require_roles(["admin"])
require_dispatcher = require_roles(["dispatcher"])
require_citizen = require_roles(["citizen"])
