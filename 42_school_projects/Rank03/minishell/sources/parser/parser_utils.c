/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser_utils.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/11 16:45:13 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		ft_count_words(t_token *tokens);
void	ft_free_array(char **str);
void	ft_free_redirects(t_redirect *redirect);

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
