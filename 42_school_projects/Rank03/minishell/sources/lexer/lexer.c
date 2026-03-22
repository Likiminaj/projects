/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/21 16:01:32 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/20 18:55:49 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

t_token		*ft_lex(char *line, int *exit_status);
static int	ft_add_operator(char *line, int i, t_token **list,
				int *exit_status);
static int	ft_add_word(char *line, int i, t_token **list,
				int *exit_status);
static int	ft_token_type(char c1, char c2, t_token_type *type);
static void	ft_append_token(t_token **list, t_token *tok);

/* Converts input string into a linked list of tokens. */
t_token	*ft_lex(char *line, int *exit_status)
{
	int		i;
	int		j;
	t_token	*list;

	i = 0;
	list = NULL;
	while (line[i])
	{
		if (ft_isspace(line[i]))
			i++;
		else
		{
			if (ft_isoperator(line[i]))
				j = ft_add_operator(line, i, &list, exit_status);
			else
				j = ft_add_word(line, i, &list, exit_status);
			if (j < 0)
			{
				ft_free_tokens(&list);
				return (NULL);
			}
			i += j;
		}
	}
	return (list);
}

/* Create a token for operators (|, <, >, <<, >>). */
static int	ft_add_operator(char *line, int i, t_token **list,
			int *exit_status)
{
	int				j;
	t_token			*tok;
	t_token_type	type;

	j = ft_token_type(line[i], line[i + 1], &type);
	if (j == 0)
	{
		ft_putendl_fd("minishell: syntax error: token\n", 2);
		*exit_status = 2;
		return (-1);
	}
	tok = malloc(sizeof(t_token));
	if (!tok)
		return (ft_malloc_error(exit_status), -1);
	tok->word = NULL;
	tok->next = NULL;
	tok->type = type;
	ft_append_token(list, tok);
	return (j);
}

/* Creates a token for a word (command/argument/filename). */
static int	ft_add_word(char *line, int i, t_token **list,
			int *exit_status)
{
	int		len;
	t_token	*tok;

	len = ft_wordlen(line, i);
	if (len < 0)
	{
		ft_putendl_fd("minishell: syntax error: unclosed quote", 2);
		return (*exit_status = 2, -1);
	}
	tok = ft_new_word_tok(line, i, len, exit_status);
	if (!tok)
		return (-1);
	ft_append_token(list, tok);
	return (len);
}

/* Determine which operator and its length. */
static int	ft_token_type(char c1, char c2, t_token_type *type)
{
	if (c1 == '|')
		return (*type = TOKEN_PIPE, 1);
	if (c1 == '<' && c2 == '<')
		return (*type = TOKEN_HEREDOC, 2);
	if (c1 == '<')
		return (*type = TOKEN_REDIRECT_IN, 1);
	if (c1 == '>' && c2 == '>')
		return (*type = TOKEN_REDIRECT_APPEND, 2);
	if (c1 == '>')
		return (*type = TOKEN_REDIRECT_OUT, 1);
	return (0);
}

/* Add token to end of linked list. */
static void	ft_append_token(t_token **list, t_token *tok)
{
	t_token	*i;

	i = *list;
	if (!i)
		*list = tok;
	else
	{
		while (i->next)
			i = i->next;
		i->next = tok;
	}
}
