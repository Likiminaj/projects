#include "minishell_parser_test.h"

t_token	*tok_new(t_token_type type, const char *word)
{
	t_token	*t;

	t = (t_token *)malloc(sizeof(t_token));
	if (!t)
		return (NULL);
	t->type = type;
	t->word = NULL;
	if (word)
	{
		t->word = ft_strdup(word);
		if (!t->word)
		{
			free(t);
			return (NULL);
		}
	}
	t->next = NULL;
	return (t);
}

void	tok_add_back(t_token **lst, t_token *new_node)
{
	t_token	*cur;

	if (!lst || !new_node)
		return ;
	if (!*lst)
	{
		*lst = new_node;
		return ;
	}
	cur = *lst;
	while (cur->next)
		cur = cur->next;
	cur->next = new_node;
}

void	tok_free_all(t_token **lst)
{
	t_token	*cur;
	t_token	*nxt;

	if (!lst || !*lst)
		return ;
	cur = *lst;
	while (cur)
	{
		nxt = cur->next;
		free(cur->word);
		free(cur);
		cur = nxt;
	}
	*lst = NULL;
}
