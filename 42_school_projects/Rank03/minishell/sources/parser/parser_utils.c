/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser_utils.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/18 16:17:06 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		ft_count_words(t_token *tokens);
void	ft_free_array(char **str);
void	ft_free_redirects(t_redirect *redirect);

/* Counts word tokens before the next pipe, validating redirections. */
int	ft_count_words(t_token *tokens)
{
	int		i;
	t_token	*temp;

	i = 0;
	if (!tokens)
		return (0);
	temp = tokens;
	while (temp && temp->type != TOKEN_PIPE)
	{
		if (temp->type != TOKEN_WORD)
		{
			if (!temp->next || temp->next->type != TOKEN_WORD)
				return (-1);
			temp = temp->next->next;
		}
		else
		{
			i++;
			temp = temp->next;
		}
	}
	return (i);
}

/* Frees a NULL-terminated array of strings. */
void	ft_free_array(char **str)
{
	int	i;

	if (!str)
		return ;
	i = 0;
	while (str[i])
	{
		free(str[i]);
		i++;
	}
	free(str);
}

/* Frees all nodes in a redirection linked list. */
void	ft_free_redirects(t_redirect *redirect)
{
	t_redirect	*tmp;

	while (redirect)
	{
		tmp = redirect->next;
		free(redirect->file);
		free(redirect);
		redirect = tmp;
	}
}

int	ft_syntax_error_pipe(t_token *tokens, int *exit_status)
{
	if (tokens && tokens->type == TOKEN_PIPE)
	{
		ft_putendl_fd(
			"minishell: syntax error near unexpected token `|'", 2);
		*exit_status = 2;
		return (1);
	}
	return (0);
}
