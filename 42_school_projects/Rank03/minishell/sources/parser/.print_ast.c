#include "minishell_parser_test.h"

static const char	*tok_name(t_token_type t)
{
	if (t == TOKEN_WORD) return ("WORD");
	if (t == TOKEN_PIPE) return ("PIPE");
	if (t == TOKEN_REDIRECT_IN) return ("<");
	if (t == TOKEN_REDIRECT_OUT) return (">");
	if (t == TOKEN_REDIRECT_APPEND) return (">>");
	if (t == TOKEN_HEREDOC) return ("<<");
	return ("?");
}

static const char	*redir_name(t_redirect_type t)
{
	if (t == REDIR_IN) return ("<");
	if (t == REDIR_OUT) return (">");
	if (t == REDIR_APPEND) return (">>");
	if (t == REDIR_HEREDOC) return ("<<");
	return ("?");
}

void	print_tokens(t_token *t)
{
	printf("TOKENS:\n");
	while (t)
	{
		printf("  [%s] '%s'\n", tok_name(t->type),
			t->word ? t->word : "(null)");
		t = t->next;
	}
}

static void	print_args(char **args)
{
	int	i;

	if (!args)
	{
		printf("    args: (null)\n");
		return ;
	}
	printf("    args:\n");
	i = 0;
	while (args[i])
	{
		printf("      - %s\n", args[i]);
		i++;
	}
}

static void	print_redirects(t_redirect *r)
{
	if (!r)
	{
		printf("    redirects: (none)\n");
		return ;
	}
	printf("    redirects:\n");
	while (r)
	{
		printf("      - %s %s\n", redir_name(r->type),
			r->file ? r->file : "(null)");
		r = r->next;
	}
}

static void	print_ast_rec(t_ast *node, int depth)
{
	int	i;

	for (i = 0; i < depth; i++)
		printf("  ");
	if (!node)
	{
		printf("(null)\n");
		return ;
	}

	if (node->type == AST_PIPE)
		printf("AST_PIPE\n");
	else
		printf("AST_COMMAND\n");

	if (node->type == AST_COMMAND)
	{
		print_args(node->args);
		print_redirects(node->redirects);
		return ;
	}

	for (i = 0; i < depth; i++)
		printf("  ");
	printf("left:\n");
	print_ast_rec(node->left, depth + 1);

	for (i = 0; i < depth; i++)
		printf("  ");
	printf("right:\n");
	print_ast_rec(node->right, depth + 1);
}

void	print_ast(t_ast *node)
{
	print_ast_rec(node, 0);
}
