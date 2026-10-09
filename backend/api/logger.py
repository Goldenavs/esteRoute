import logging
import os

LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "agent_transactions.log")

logger = logging.getLogger("esteRoute")
logger.setLevel(logging.INFO)

if not logger.handlers:
    fh = logging.FileHandler(LOG_FILE)
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - [%(levelname)s] - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

def log_transaction(message: str):
    logger.info(message)
