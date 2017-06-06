Connectopus
===========

Connectopus is a MySQL and SFTP based content management tool.  It's primarily used to keep data, code and media in sync between multiple instances of the same website.  For instance, if you have a development pipeline that includes first developing your application in a 'Dev' virtual environment, then moving that content, code and media to a 'Stage' environment, and then finally into Production, Connectopus can help automate that process, as well as view the differences between these different code bases.

You can connect to an unlimited number of servers in one session (limited only on your system resources).  So you can connect to databases and via SFTP across multiple environments/installations.

## Connectopus Features

* Compare tables across multiple databases across multiple environments.
* Sync media folders across multiple SFTP endpoints.
* Code compare and sync across multiple installations.

## Project Status

This project is in active development.  While there is some utility in this tool at the moment, it is still very pre-alpha.

## Installation Instructions

You will need to install the latest version of [Node.js](https://nodejs.org/en/) to install this project.

Once Node.js is installed, clone this repository to your local machine, navigate to the directory you cloned this project into inside of a Terminal and type the following

```bash
npm install
```
This should install the node dependencies for this project.

To run the application, just type the following into the console:

```bash
npm start
```
