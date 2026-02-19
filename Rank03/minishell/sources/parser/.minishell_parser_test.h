#ifndef MINISHELL_PARSER_TEST_H
# define MINISHELL_PARSER_TEST_H

# include <unistd.h>
# include <stdlib.h>
# include <stdio.h>
# include <limits.h>

/* libft */
# include "../../libft/libft.h"

/* TOKEN TYPES */
typedef enum e_token_type
{
	TOKEN_WORD,
	TOKEN_PIPE,
	TOKEN_REDIRECT_IN,
	TOKEN_REDIRECT_OUT,
	TOKEN_REDIRECT_APPEND,
	TOKEN_HEREDOC,
}	t_token_type;

typedef struct s_token
{
	t_token_type	type;
	char			*word;
	struct s_token	*next;
}	t_token;

/* AST */
typedef enum e_ast_type
{
	AST_COMMAND,
	AST_PIPE,
}	t_ast_type;

typedef enum e_redirect_type
{
	REDIR_IN,
	REDIR_OUT,
	REDIR_APPEND,
	REDIR_HEREDOC
}	t_redirect_type;

typedef struct s_redirect
{
	t_redirect_type		type;
	char				*file;
	struct s_redirect	*next;
}	t_redirect;

typedef struct s_ast
{
	t_ast_type		type;
	char			**args;
	t_redirect		*redirects;
	struct s_ast	*left;
	struct s_ast	*right;
}	t_ast;

/* ===== parser prototypes ===== */
t_ast		*ms_parse(t_token *tokens, int *exit_status);
t_ast		*ft_build_command(t_token **tokens, int *exit_status);
t_ast		*ft_build_pipeline(t_token **tokens, int *exit_status);

int			ft_count_words(t_token *tokens);
void		ft_free_array(char **str);
void		ft_free_redirects(t_redirect *redirect);

t_redirect	*ft_build_redirects(t_token **tokens, int *exit_status);

t_ast		*ft_build_ast_node(t_ast_type type, int *exit_status);
void		ft_free_ast(t_ast *node);
void		ft_malloc_error(int *exit_status);

char		**ft_build_args(t_token **tokens, int *exit_status);

/* ===== tester helpers ===== */
t_token		*tok_new(t_token_type type, const char *word);
void		tok_add_back(t_token **lst, t_token *new_node);
void		tok_free_all(t_token **lst);

void		print_tokens(t_token *t);
void		print_ast(t_ast *node);

#endif
