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


## Instructions

### Prerequisites

- **Operating System:** Linux or macOS
- **Compiler:** cc
- **Required Libraries:** 
  - readline
  - GNU Make

### Compilation

Compile the project using the provided Makefile:
```bash
make
```

This will:
- Compile the libft library
- Compile all minishell source files with `-Wall -Wextra -Werror` flags
- Generate the `minishell` executable

**Additional make commands:**
```bash
make clean   # Remove object files
make fclean  # Remove object files and executable
make re      # Rebuild everything from scratch
```

### Launch

Run the minishell:
```bash
./minishell
```

You should see the prompt:
```
minishell$
```

## Resources

### Documentation & References

#### Official Documentation
- [POSIX Shell Command Language](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html) - Standard shell specification
- [Linux man pages](https://man7.org/linux/man-pages/) - System calls documentation (fork, execve, pipe, dup2, signal, etc.)

#### Tutorials & Articles
- [Building a shell - tutorial](https://brennan.io/2015/01/16/write-a-shell-in-c/) - Shell basics and parsing
- [Writing a Unix Shell](https://www.cs.purdue.edu/homes/grr/SystemsProgrammingBook/Book/Chapter5-WritingYourOwnShell.pdf) - Shell implementation guide
- [Lexical Analysis and Tokenization](https://en.wikipedia.org/wiki/Lexical_analysis) - Input parsing concepts

### AI Usage

AI tools (Claude/ChatGPT) were used as learning aids and debugging assistants during this project, specifically for:

#### Learning & Understanding
- **Concept explanations** - Understanding system calls behavior (fork, pipe, signals, file descriptors)
- **Documentation clarification** - Interpreting complex manual pages and technical specifications
- **Best practices** - Learning proper error handling patterns and memory management techniques

#### Development Support
- **Debugging assistance** - Identifying logic errors, memory leaks, and edge cases through code review
- **Code optimization** - Suggestions for refactoring
- **Testing strategies** - Guidance on creating comprehensive test cases and validation scripts

**Important Note:** All code was written, understood, and tested by the project authors. AI was used as a teaching tool and reference guide, similar to consulting documentation or technical forums, but did not generate final implementation code. Every function, algorithm, and design decision was made with full comprehension of the underlying concepts and project requirements.
