# Portim

[![CI](https://github.com/catapio/portim/actions/workflows/ci.yml/badge.svg)](https://github.com/catapio/portim/actions/workflows/ci.yml)
[![Documentation](https://img.shields.io/badge/docs-portim.catap.io-blue)](https://portim.catap.io/docs)

- [What is this?](#what-is-this)
- [Pre-requisites](#pre-requisites)
- [Development](#development)
- [Code](#code)
    - [Routes](#routes)
    - [Use Case Classes](#use-case-classes)
    - [Service Classes](#service-classes)
    - [Shared Utilities and Entities](#shared-utilities-and-entities)
- [Dockerfile](#dockerfile)
- [GitHub Actions](#github-actions)

## What is this?

Portim API enables you to create and manage projects, interfaces, and sessions
in catap.io, offering full control over inbound and outbound messaging flows.
With Portim, you can seamlessly receive messages from your WhatsApp provider,
process them with a bot, and dynamically route them to a human agent when
needed—all without altering the original request’s body content. This
flexibility ensures smooth transitions and consistent communication across
different providers and workflows.

## Pre-requisites

You will need:

- Node 22
- PostgreSQL 15
- Optional Supabase Account (if want to manage users with supabase, instead you can
create a mock auth class)
- Optional Grafana Loki (set NODE_ENV=local and it is not necessary)

## Development

To run in develop mode this API, you need to follow these steps:

```bash
git clone git@github.com:catapio/portim.git
cd portim
npm install -g pnpm
pnpm install
pnpm dev
```

Then you can develop new features and test on port you have defined in PORT
env variable.

## Documentation

Here is the Portim documentation, describing the use cases and services.

### Routes

All routes documentation you can find in [Portim Documentation](https://portim.catap.io/docs) 

### Use Case Classes

#### UserUseCases

- **Purpose**: Manages user-related operations.
- **Key Methods**:
    - **createUser**: Creates a new User entity, hashes the password (via
    UserService), and returns the newly created user.
    - **authenticateUser**: Authenticates a user using email and password,
    returning a signed-in result (token + user info) via UserService.

#### SessionUseCases

- **Purpose**: Manages session-related operations in the system.
- **Key Methods**:
    - **createSession**: Looks up the control interface to create a Session in
    the database via SessionService.
	- **getSession**: Fetches an existing Session by ID.
    - **updateSession**: Updates session fields (like target) if the new value
    is non-empty.
	- **deleteSession**: Deletes the session from the database.

#### ProjectUseCases

- **Purpose**: Handles project lifecycle and user membership in projects.
- **Key Methods**:
    - **createProject**: Creates a Project, associates it with the requesting
    user, and updates both the user and project records via UserService and
    ProjectService.
	- **getProject**: Retrieves a specific Project by ID.
    - **addUserToProject / removeUserOfProject**: Allows only the owner of a
    project to add or remove users. Throws a CommonError if a non-owner attempts
    these actions.
    - **deleteProject**: Ensures only the owner can delete a project, then
    removes the project from all participating users before finally deleting it.

#### InterfaceUseCases

- **Purpose**: Deals with creating and managing “interfaces” that define
endpoints, control, and external ID fields for a project.
- **Key Methods**:
    - **createInterface**: Builds a new Interface and saves it to the database.
    - **getInterface**: Fetches an interface by ID.
    - **updateInterface**: Updates fields of an existing interface, validating
    that a referenced control interface exists and that externalIdField is valid
    (via isValidPath).
	- **deleteInterface**: Deletes the interface record.

#### MessageUseCases

- **Purpose**: Handles creating and managing messages associated with sessions
and interfaces.
- **Key Methods**:
    - **createMessage**:
	    - If sessionId is given, uses that session.
        - If no sessionId, attempts to find or create a Client using the
        external ID in the message body, then finds/creates a Session.
        - Hashes the message body with crypto.createHash("sha256") before
        creating a Message.
        - Depending on who is sending the message (session.source vs. sender),
        calls the appropriate interface endpoint.
	- **getMessage**: Fetches a Message by ID.
	- **updateMessage**: Updates the status of an existing message.
	- **deleteMessage**: Removes the message from the database.

### Services Classes

Each of the UseCases classes depends on one or more corresponding service
classes:

#### UserService

Creates and authenticates users, typically delegating password handling and
token generation. Here is possible to find an user by id and updates when add to
a project.

#### SessionService

Creates, updates, and deletes session records. Sometimes includes methods like
findBySource.

#### ProjectService

Manages persistence for Project entities (create, update, delete, find).

#### InterfaceService

Manages Interface entities, ensuring they exist and are valid.

#### MessageService

Handles storing and retrieving Message entities from persistence.

#### ClientService

Looks up or creates Client entities by external ID.

These services encapsulate the data layer logic—often calling the database
directly or using an ORM—while use case classes focus on application logic and
domain rules.

### Shared Utilities and Entities

#### Entities 

User, Session, Project, Interface, Message and Client represents the main domain
objects. They store essential properties and usually contain convenience methods
like addProject, removeProject, etc.

#### CommonError 

A custom error class for handling domain-specific or permission-based
rejections. Throws errors with custom messages and status codes.

#### Logger

A simple wrapper for logging (e.g., logger.debug, logger.info). Mocked out in
tests to avoid unnecessary output.

#### isValidPath / getValueFromPath

Utility functions that help validate or extract nested values from objects. Used
in cases like verifying a valid external ID path.

## Dockerfile

Dockerfile uses a multi-stage build approach to keep the final image small and
optimized for production:

1. base stage:
    - Starts from a lightweight Node.js image.
    - Installs pnpm globally.
2. build stage:
    - Installs development dependencies (like build-essential, node-gyp) needed
    to compile native modules.
    - Copies application code, runs pnpm install, builds the project, and
    then re-installs production-only dependencies.
3. Final stage:
    - Copies the built application from the build stage into a fresh Node.js
    base image.
    - Sets NODE_ENV=production, exposes port 3000, and runs node dist/server.js.

This ensures that the final image doesn’t contain unnecessary dev dependencies
or build artifacts.

## GitHub Actions

This GitHub Actions workflow is named `CI and Deploy` and is triggered on every
push to the `master branch`. It has two jobs:

1. test job:
    - Ensures that the application code passes all automated tests before
    proceeding to deployment.
    - The job runs on an Ubuntu environment, sets up Node.js, installs
    dependencies using PNPM, and executes the pnpm test command to run your Jest
    tests.
2. deploy job:
    - Only runs if the test job completes successfully.
    - Deploys the application to Fly.io using the Fly CLI (flyctl), relying on
    the FLY_API_TOKEN secret for authentication.
    - Uses the --remote-only flag to deploy from a remote machine.
