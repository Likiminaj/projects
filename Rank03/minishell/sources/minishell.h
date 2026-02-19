/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   minishell.h                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/22 15:28:53 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/19 18:37:28 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef MINISHELL_H
# define MINISHELL_H

# include <unistd.h>
# include <stdlib.h>
# include <fcntl.h>
# include <limits.h>
# include <stdio.h>
# include <sys/types.h>
# include <sys/wait.h>
# include "../libft/libft.h"
# include <signal.h>
# include <readline/readline.h>
# include <readline/history.h>

# define SENTINEL "\x01"

/* ENVIRONMENT STRUCTURE */
typedef struct s_env
{
	char	**envp;			/* Array of environment variables (KEY=VALUE) */
	int		exit_status;	/* Last command exit status ($?) */
	int		should_exit;	/* Flag to exit shell (for 'exit' builtin) */
}	t_env;
/*---*/

/* TOKEN TYPES */
typedef enum e_token_type
{
	TOKEN_WORD,				/* Regular word/command/argument */
	TOKEN_PIPE,				/* | */
	TOKEN_REDIRECT_IN,		/*  */
	TOKEN_REDIRECT_OUT,		/* > */
	TOKEN_REDIRECT_APPEND,	/* >> */
	TOKEN_HEREDOC,			/*  */
}	t_token_type;

typedef struct s_token
{
	t_token_type	type;	/* Type of token (WORD, PIPE, etc.) */
	char			*word;	/* The actual string value */
	struct s_token	*next;	/* Next token in the list */
}	t_token;
/*---*/

/* AST TREE */
typedef enum e_ast_type
{
	AST_COMMAND,			/* Simple command */
	AST_PIPE,				/* Pipeline (|) */
}	t_ast_type;

typedef enum e_redirect_type
{
	REDIR_IN,				/* < (input) > (output) */
	REDIR_OUT,
	REDIR_APPEND,			/* >> (append), << (heredoc)*/
	REDIR_HEREDOC
}	t_redirect_type;

typedef struct s_redirect
{
	t_redirect_type		type;		/* R_IN, R_OUT, R_APPEND, R_HEREDOC */
	char				*file;		/* Filename or heredoc delimiter */
	struct s_redirect	*next;		/* Next redirect in chain */
}	t_redirect;

typedef struct s_ast
{
	t_ast_type		type;			/* Type of AST node */
	char			**args;			/* Command arguments (NULL-terminated) */
	t_redirect		*redirects;		/* Linked list of redirections */
	struct s_ast	*left;			/* Left child */
	struct s_ast	*right;			/* Right child */
}	t_ast;
/*---*/

/** FUNCTIONS **/

/* MAIN */
int				shell_loop(t_env *env);
int				ft_process_line(char *line, t_env *env, int exit_status);
void			ft_input_check(int argc);

/* SIGNAL SETUP */
void			ft_interactive_signals(void);
void			ft_sigint_handler(int sig);
void			ft_restore_signals(void);
void			ft_heredoc_signals(void);
void			ft_heredoc_sigint_handler(int sig);

/* LEXER */
int				ft_token_len(t_token *tokens);
int				ft_copy_quoted_text(char *word, char quote, int *i, char *clean);
void			ft_free_tokens(t_token **list);
char		*ft_new_clean_word(char *word, int *exit_status);
char		*ft_strip_quotes(char *word, int *exit_status);
t_token		*ft_lex(char *line, int *exit_status);
t_token		*ft_create_word_token(char *line, int i, int len, int *exit_status);

/* PARSER */
t_ast			*ms_parse(t_token *tokens, int *exit_status);
t_ast			*ft_build_command(t_token **tokens, int *exit_status);
t_ast			*ft_build_pipeline(t_token **tokens, int *exit_status);
int				ft_count_words(t_token *tokens);
void			ft_free_array(char **str);
void			ft_free_redirects(t_redirect *redirect);
t_redirect		*ft_build_redirects(t_token **tokens, int *exit_status);
t_ast			*ft_build_ast_node(t_ast_type type, int *exit_status);
void			ft_free_ast(t_ast *node);
void			ft_malloc_error(int *exit_status);
char			**ft_build_args(t_token **tokens, int *exit_status);

/* EXPANSION */
int				ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_command(t_ast *ast, t_env *env, int *exit_stat);
int				ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat);
void			restore_sentinels(char *str);
int				dol_found(char *argument);
int				is_dol_only(char *argument);
int				char_is_valid(char c);
char			*expand_string(char *str, char **envp, int *exit_stat);
int				str_exp(char *str, char **envp, char **result, int *exit_stat);
void			expansion_error(char *var_name);
char			*ft_charjoin(char *str, char c);
int				expand_var(t_ast *ast, int i, int *exit_status, char **envp);
char			*find_var_name(char *arg);
int				expand_error_code(t_ast *ast, int i, int *exit_status);
int				expand_fst_var(t_ast *ast, char **envp, char *var_name, int i);
int				expand_var_ok(t_ast *ast, char *envp, char *var_name, int i);
int				expand_var_nok(t_ast *ast, char *var_name, int i);
void			swap_new(t_ast *ast, int i, char *new_ast);
int				find_index_in_env(char **envp, char *var_name);
char			*find_content(char *argument);

/* EXECUTION */
int				ft_exec_ast(t_ast *ast, t_env *env);
/*** COMMAND ***/
int				exec_command(t_ast *ast, t_env *env);
void			exec_ext_command(char **command, char **envp);
int				is_built_in(char *command);
int				execute_built_in(char *command, t_ast *ast, t_env *env);
char			*command_path(char *command, char **envp);
char			*check_absolute_path(char *command);
char			*search_in_paths(char *command, char **all_paths);
/*** PIPE ***/
int				exec_pipe(t_ast *ast, t_env *env);
void			exec_left(t_ast *ast, t_env *env, int *fd);
void			exec_right(t_ast *ast, t_env *env, int *fd);
/*** REDIRECTIONS ***/
int				handle_redirections(t_redirect *redirects);
int				execute_built_in_redirections(t_ast *ast, t_env *env);
int				heredoc_handling(char *delimiter);
void			read_heredoc_lines(int write_fd, char *delimiter);

/* BUILT-IN FUNCTIONS */
/*** CD ***/
int				builtin_cd(t_ast *ast, t_env *env);
int				cd_home(t_env *env);
int				exec_cd(t_env *env, char *path);
/*** ECHO ***/
int				builtin_echo(t_ast *ast);
int				check_n(char *argument, int *no_new_line);
void			exec_echo(char *argument, int *space);
/*** ENV ***/
int				builtin_env(t_ast *ast, t_env *env);
/*** EXIT ***/
int				builtin_exit(t_ast *ast, t_env *env);
void			set_exit(t_env *env, int exit_status, int should_exit);
int				ft_isnum(char *string);
/*** EXPORT ***/
int				builtin_export(t_ast *ast, t_env *env);
void			print_export(t_env *env);
void			print_export_with_content(char *var_name, char *env_line);
int				exec_export(t_env *env, char *var_name, char *content);
int				varname_is_valid(char *var_name);
char			*var_name_export(char *arg);
char			*escaped_quotes(char *content);
int				len_esc_content(char *content);
char			**copy_envp(char **envp);
void			bubble_sort_envp(char **envp);
int				equal_found(char *arg);
/*** PWD ***/
int				builtin_pwd(t_ast *ast, t_env *env);
/*** UNSET ***/
int				builtin_unset(t_ast *ast, t_env *env);
void			remove_var(char **envp, int index);
/*** ADDITIONAL UTILS ***/
void			update_var(t_env *env, char *var_name, char *content);
void			overwrite_var(t_env *env, int index, char *new_var);
char			**add_var(char **envp, char *new_var);

/* INITIALISE AND FREE ENV STRUCT */
t_env			*ft_env_init(char **envp);
void			ft_env_free(t_env *env);
void			free_array(char **array);

/* ERRORS */
void			ft_malloc_error(int *exit_status);

#endif
