#include "minishell_parser_test.h"

static void	run_case(const char *title, t_token *tokens)
{
	int		exit_status;
	t_ast	*root;

	exit_status = 0;
	printf("\n====================\n");
	printf("CASE: %s\n", title);
	printf("====================\n");

	print_tokens(tokens);

	root = ms_parse(tokens, &exit_status);

	printf("\nexit_status = %d\n", exit_status);
	printf("AST:\n");
	if (!root)
		printf("(null)\n");
	else
		print_ast(root);

	ft_free_ast(root);
	tok_free_all(&tokens);
}

int	main(void)
{
	/* echo hello */
	{
		t_token *t = NULL;
		tok_add_back(&t, tok_new(TOKEN_WORD, "echo"));
		tok_add_back(&t, tok_new(TOKEN_WORD, "hello"));
		run_case("simple command", t);
	}

	/* cat < in.txt | grep hi > out.txt */
	{
		t_token *t = NULL;
		tok_add_back(&t, tok_new(TOKEN_WORD, "cat"));
		tok_add_back(&t, tok_new(TOKEN_REDIRECT_IN, "<"));
		tok_add_back(&t, tok_new(TOKEN_WORD, "in.txt"));
		tok_add_back(&t, tok_new(TOKEN_PIPE, "|"));
		tok_add_back(&t, tok_new(TOKEN_WORD, "grep"));
		tok_add_back(&t, tok_new(TOKEN_WORD, "hi"));
		tok_add_back(&t, tok_new(TOKEN_REDIRECT_OUT, ">"));
		tok_add_back(&t, tok_new(TOKEN_WORD, "out.txt"));
		run_case("pipeline + redirects", t);
	}

	/* redirect missing filename */
	{
		t_token *t = NULL;
		tok_add_back(&t, tok_new(TOKEN_WORD, "ls"));
		tok_add_back(&t, tok_new(TOKEN_REDIRECT_OUT, ">"));
		run_case("redir missing filename", t);
	}

	/* count_words parse error path */
	{
		t_token *t = NULL;
		tok_add_back(&t, tok_new(TOKEN_WORD, "echo"));
		tok_add_back(&t, tok_new(TOKEN_REDIRECT_IN, "<"));
		tok_add_back(&t, tok_new(TOKEN_PIPE, "|"));
		run_case("count_words parse error", t);
	}

	return (0);
}
