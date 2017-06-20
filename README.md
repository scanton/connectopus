Connectopus
===========

Connectopus is a MySQL and SFTP based content management tool.  It's primarily used to keep data, code and media in sync between multiple instances of the same website.  For instance, if you have a development pipeline that includes first developing your application in a 'Dev' virtual environment, then moving that content, code and media to a 'Stage' environment, and then finally into Production, Connectopus can help automate that process, as well as view the differences between these different code bases.

You can connect to an unlimited number of servers in one session (limited only on your system resources).  So you can connect to databases and via SFTP across multiple environments/installations.

## Connectopus Features

* Compare tables across multiple databases across multiple environments.
* Sync media folders across multiple SFTP endpoints.
* Code compare and sync across multiple installations.

## Project Status

This project is in active development.  Core features are still being implemented.  Code management via SFTP now works.  SQL specific data sync is not fully implemented.

## Installation Instructions

You will need to install the latest version of [Node.js](https://nodejs.org/en/) to install this project.

Once Node.js is installed, clone this repository to your local machine, navigate to the directory you cloned this project into inside of a Terminal and type the following

```bash
sudo npm install
```

This should install the node dependencies for this project.

To run the application, just type the following into the console:

```bash
npm start
```

## Using Connectopus

### Getting Started

When you run the application for the first time, you will see an input form titled "Add New Server".  Use this form to set up the connection information (SFTP & MySQL) for your server(s).

### Adding Server Connections

As you add servers, you'll see a list on the left navigation called "Connections" that will list all of the server connections you put into the application.  Click on one or more of these Connections in the left nav and click the "Connect" button to create an SSH tunnel to your remote server.

### Active Connections

You will see the "Active Connections" of the servers that you have connected to at the top of the application.  Each Active Connection will get a specific color scheme that data from that source will share, making it easy to see which source (connection) a particular piece of data came from.

### Comparing SQL Tables Across Databases

Clicking the "Content" button/tab at the top of the application will allow you to brwose the tables in your databases.  Clicking on one of the tables in the left navigation will trigger a "diff" (a comparison of the differences) between the selected table in each of the Active Connections.

You can use the tools at the top of the data table view to filter the diff results. 

After comparing your data diffs, select the rows you would like to syncronize between servers and click "Sync Selected Rows" to move the selected data from your primary server to the other servers you are intending to bring into sync.

### Comparing Files Across SFTP Servers

Clicking the "Code" button/tab at the top of the application will allow you to browse the files (code, media, etc.) between each of the Active Connections.

Browse the file tree in the left navigation, clicking each folder to view the file differences in each directory.

Select the rows/files you would like to syncronize by clicking the checkbox at the beginning of each row.

Once you have selected the files you'd like to syncronize, click "Sync Selected Files" to have Connectopus copy and move the selected files between your SFTP servers.