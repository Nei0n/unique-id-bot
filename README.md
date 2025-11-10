# Community Role Management Bot

This bot helps manage server roles and permissions with a focus on privacy, security, and admin control. It is designed to provide automatic role assignment, secure member management, and allow admins to track and control access within the community.

## Features

### ✅ Key Features:

- **🔒 Hidden Roles**:  
  Members are assigned private roles (e.g., "Member-###") that are invisible to others. This ensures better privacy and role segregation.
  
- **🚫 DM Protection**:  
  Members can't direct message or see each other's messages, improving security and privacy within the community.

- **🧩 Auto ID Assignment**:  
  Each member receives a unique ID between 001 and 250, making member management cleaner and more organized.

- **🧹 Auto Cleanup**:  
  When a member leaves, their role is automatically deleted, freeing up the ID for future use.

- **🪵 Admin Log**:  
  All joins and leaves are logged in a dedicated `#admin-log` channel, allowing admins to track member activity.

- **🧑‍💼 Admin Only Access**:  
  Only admins can see the full list of members and all channels, providing better control over sensitive data.

---

## New Features Breakdown:

- **Improved Privacy and Security**:  
  Hidden roles and DM protection allow for better control over member interactions and data privacy.
  
- **Automated Member Management**:  
  Auto ID Assignment and Auto Cleanup keep your member list organized without manual intervention.

- **Comprehensive Admin Control**:  
  Admin-only access and logs give admins full control and visibility, ensuring sensitive data remains secure.

---

## Installation & Setup
  If you cannot install and setup then its not for you 

# Permissions for Bot Functionality

To ensure the bot functions correctly, you need to grant the following permissions in your Discord server:

- **Manage Roles**: For assigning and removing roles.
- **Read Messages**: To read messages in designated channels.
- **Send Messages**: To send messages to #admin-log and other channels.
- **View Channels**: To allow the bot to view relevant channels and logs.
- **Administrator** *(Optional)*: If you want the bot to have full administrative control over the server.

> **Note:** Make sure the bot’s role is higher than the roles it needs to manage, including "Admin" roles.

# Configuration

## Admin-Only Access:
Only **admin roles** can view member lists and access certain channels. Be sure to adjust your permissions accordingly to restrict access.

## ID Range:
The bot automatically assigns member **IDs** from **001 to 250**. Ensure your server has the capacity for the desired number of members.

## Channels:
Ensure you have an **#admin-log** channel to capture all member join/leave logs.

# Changelog

## Version 1.0.0:
- **Initial Release**: Added features for automatic role management, DM protection, admin logging, and more.

---

# Contributing

We welcome contributions to the development of this bot! If you have any ideas, bug fixes, or improvements, feel free to fork the repository, make changes, and submit a pull request. Please make sure to follow the coding standards and ensure all tests pass.

## Steps to contribute:
- DM on Discord @mafiab0y

# License
This bot is licensed under the **MIT License**. See the LICENSE file for more details.

---

## Breakdown of the Sections:

- **Features**: A detailed list of what the bot offers (privacy, security, role management).
- **Installation & Setup**: Step-by-step guide to get the bot up and running.
- **Permissions**: The permissions needed by the bot to function properly in the server.
- **Configuration**: Additional configuration steps for admins to set up roles and channels.
- **Warning**: An important alert to users regarding configuration and permissions.
- **Changelog**: The log for this version (you can expand as future versions are released).
- **Contributing**: Instructions for developers who want to contribute to the project.
- **License**: Specifies the project's licensing (MIT License in this case).

---
