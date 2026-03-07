*This project has been created as part of the 42 curriculum by cpesty and lraghave.*

# Minishell

## Description

Minishell is a simplified Unix shell written in C.  
The goal of this project is to recreate essential behavior of Bash, including command execution, pipes, redirections, environment variable expansion, and signal handling.

This project focuses heavily on:

- Process creation (`fork`, `execve`)
- File descriptors and redirections
- Pipes and inter-process communication
- Signal handling
- Parsing and command execution flow

The shell supports execution of built-in commands and external programs, while closely mimicking Bash behavior for the required features.

---

## Features

### Prompt & History
- Displays a prompt waiting for user input
- Maintains command history using `readline`

### Execution
- Executes commands via:
  - Absolute path
  - Relative path
  - PATH variable lookup

### Redirections
- `<` input redirection
- `>` output redirection
- `>>` append output redirection
- `<<` heredoc

### Pipes
- Supports pipelines using `|`

### Environment Variables
- Expands `$VAR`
- Expands `$?` (last exit status)

### Quotes
- Single quotes `'` prevent interpretation of metacharacters
- Double quotes `"` prevent interpretation except for `$`

### Signal Handling (Interactive Mode)
- `Ctrl-C` → new prompt on new line
- `Ctrl-D` → exits shell
- `Ctrl-\` → ignored

### Built-in Commands
- `echo -n`
- `cd`
- `pwd`
- `export`
- `unset`
- `env`
- `exit`

---

## Architecture Overview

The shell is divided into clearly separated stages:

### 1) Lexer / Tokenizer
Transforms the raw input string into structured tokens while respecting quoting rules.  
Recognizes operators such as `|`, `<`, `>`, `<<`, `>>` and distinguishes them from words and arguments.

### 2) Parser
Organizes tokens into structured command units:
- Associates redirections with the correct command
- Groups commands into pipelines
- Preserves argument ordering

This stage prepares a clear execution plan.

### 3) Execution Engine
Responsible for:
- Creating processes (`fork`)
- Launching programs (`execve`)
- Managing pipes (`pipe`, `dup2`)
- Handling redirections
- Tracking exit status

### 4) Environment & Signal Management
- Expands environment variables (`$VAR`, `$?`)
- Implements required interactive signal behavior


## Installation & Usage

### Compile

```bash
make
