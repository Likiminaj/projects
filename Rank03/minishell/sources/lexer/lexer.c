/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/21 16:01:32 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/19 17:41:49 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

// prototype(s)
static int	ft_add_operator(char *line, int i, t_token **list,
				int *exit_status);
static int	ft_add_word(char *line, int i, t_token **list,
				int *exit_status);
static int	ft_token_type(char c1, char c2, t_token_type *type);
static void	ft_append_token(t_token **list, t_token *tok);

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
	tok = malloc(sizeof(t_token));
	tok = ft_create_word_token(line, i, len, exit_status);
	if (!tok)
		return (ft_malloc_error(exit_status), -1);
	tok->next = NULL;
	tok->type = TOKEN_WORD;
	tok->word = ft_substr(line, i, len);
		return (-1);
	if (!tok->word)
	{
		free (tok);
		return (ft_malloc_error(exit_status), -1);
		free(tok);
		return (-1);
	}
	ft_append_token(list, tok);
	return (len);
}

static int	ft_add_operator(char *line, int i, t_token **list,
			int *exit_status)
{
	int				j;
	t_token			*tok;
	t_token_type	type;

	j = ft_token_type(line[i], line[i +1], &type);
	if (j == 0)
	{
		ft_putendl_fd("minishell: syntax error: token c", 2);
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
