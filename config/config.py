import os
import shutil
from pathlib import Path
from datetime import datetime

class Config:
    # Base configuration (shared between environments)
    APP_NAME = "401k Document Management"
    
    # Environment detection
    @classmethod
    def is_development(cls):
        return not os.path.exists(Path(os.path.expanduser("~")) / "Hohimer Wealth Management")
    
    # Database paths
    @classmethod
    def get_db_path(cls):
        if cls.is_development():
            return r"C:\CODING\401401401\backend\database\401k_local_dev.db"
        else:
            shared_base = cls.find_shared_folder()
            return f"{shared_base}/HohimerPro/database/401k_payments_LIVE.db"
    
    # Document storage
    @classmethod
    def get_document_storage_path(cls):
        if cls.is_development():
            # Local dev documents folder
            path = r"C:\CODING\401401401\dev_environment\document_storage"
            os.makedirs(path, exist_ok=True)
            return path
        else:
            shared_base = cls.find_shared_folder()
            return f"{shared_base}/compliance/mail/2025"
    
    # Client folders root
    @classmethod
    def get_clients_root(cls):
        if cls.is_development():
            # Mock client folders for development
            path = r"C:\CODING\401401401\dev_environment\mock_client_folders"
            os.makedirs(path, exist_ok=True)
            return path
        else:
            shared_base = cls.find_shared_folder()
            return f"{shared_base}/401k Clients"
    
    # Find shared folder for production environment
    @classmethod
    def find_shared_folder(cls):
        user_profile = os.path.expanduser("~")
        shared_path = Path(user_profile) / "Hohimer Wealth Management" / "Hohimer Company Portal - Company" / "Hohimer Team Shared 4-15-19"
        
        if shared_path.exists():
            return str(shared_path)
        else:
            raise Exception("Shared folder not found. Is OneDrive synced?")
    
    # Backup database path
    @classmethod
    def get_backup_path(cls):
        if cls.is_development():
            path = r"C:\CODING\401401401\dev_environment\db_backups"
            os.makedirs(path, exist_ok=True)
            return path
        else:
            shared_base = cls.find_shared_folder()
            return f"{shared_base}/HohimerPro/database/db_backups"
    
    # Create database backup
    @classmethod
    def create_backup(cls):
        """Create timestamped backup of database"""
        timestamp = datetime.now().strftime("%m-%d-%Y_%I-%M_%p")
        username = os.getenv("USERNAME")
        
        backup_path = cls.get_backup_path()
        
        # Source database
        db_path = cls.get_db_path()
        
        # Backup filename
        if cls.is_development():
            backup_name = f"401k_local_dev_{username}_{timestamp}.db"
        else:
            backup_name = f"401k_payments_{username}_{timestamp}.db"
        
        # Create backup
        backup_file = os.path.join(backup_path, backup_name)
        shutil.copy(db_path, backup_file)
        
        # Clean up old backups (keep last 20)
        cls.cleanup_old_backups(backup_path, 20)
        
        return backup_file
    
    @classmethod
    def cleanup_old_backups(cls, backup_path, keep_count=20):
        """Remove old backups, keeping only the most recent ones"""
        backups = []
        
        # Get list of backup files
        for file in os.listdir(backup_path):
            if file.endswith('.db'):
                full_path = os.path.join(backup_path, file)
                created_time = os.path.getctime(full_path)
                backups.append((full_path, created_time))
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x[1], reverse=True)
        
        # Remove old backups
        for path, _ in backups[keep_count:]:
            try:
                os.remove(path)
            except:
                pass  # Ignore errors in cleanup
    
    # Document types
    DOCUMENT_TYPES = ["Check", "Receipt", "Invoice", "Other"]