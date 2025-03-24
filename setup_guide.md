Office Setup Instructions - setup_guide.md
mdCopy# 401k Management System - Office Setup Guide

## Introduction
This document provides step-by-step instructions for setting up the 401k Management System in your office environment after development. Follow these steps to ensure the application works correctly with your shared OneDrive folders.

## Prerequisites
- OneDrive is properly synced on the computer
- The "Hohimer Wealth Management" folder is accessible
- Administrator privileges to install software

## Step 1: Database Setup
The system will automatically connect to the production database when run from the office because it detects the presence of the Hohimer folder structure. No manual configuration needed!

## Step 2: Client Folder Mapping
For document shortcuts to work correctly, you need to map your client database names to the actual folder names:

1. Open SQLite Studio or your preferred database tool
2. Connect to the production database at: `[Shared Folder]/HohimerPro/database/401k_payments_LIVE.db`
3. Run the following SQL for each client:

```sql
INSERT INTO client_folders (client_id, actual_folder_name) 
VALUES (CLIENT_ID, 'ACTUAL_FOLDER_NAME');
Replace:

CLIENT_ID with the numerical ID from the clients table
ACTUAL_FOLDER_NAME with the exact folder name as it appears in the 401k Clients folder

Example:
sqlCopyINSERT INTO client_folders (client_id, actual_folder_name) 
VALUES (1, 'ABC Company Inc');
Step 3: Document Storage Verification
Ensure that the following folders exist and are accessible:

Document storage folder: [Shared Folder]/compliance/mail/2025/
Client folders: [Shared Folder]/401k Clients/

The application will store uploaded documents in the first location and create shortcuts in the appropriate client subfolders.
Step 4: Installing the Application

Download the application installer
Run the installer with administrator privileges
Follow the prompts to complete installation
Create a desktop shortcut for easy access

Step 5: First Run Configuration

Launch the application
The system will automatically create a backup of the production database
Verify that you can see client data and payment history
Test uploading a document to ensure paths are correctly configured

Troubleshooting
"Shared folder not found" Error

Ensure OneDrive is fully synced
Verify the path structure matches: [User Profile]/Hohimer Wealth Management/Hohimer Company Portal - Company/Hohimer Team Shared 4-15-19

Document Shortcuts Not Working

Check client_folders table mappings
Verify the client has the expected subfolder structure (Consulting Fee, Checks, etc.)

Database Connection Issues

Ensure you have read/write permissions to the database file
Check if another user has the database locked