/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer_helpers2.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/19 17:49:47 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/18 13:46:31 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

/* Copy text inside quotes, converting $ to \x01 in single quotes. */
int	ft_copy_text(char *word, char quote, int *i, char *clean)
{
	int	j;

	j = 0;
	while (word[*i] && word[*i] != quote)
	{
		if (quote == '\'' && word[*i] == '$')
			clean[j++] = '\x01';
		else
			clean[j++] = word[*i];
		(*i)++;
	}
	return (j);
}

int	ft_last_token_is_pipe(t_token *tokens)
{
	if (!tokens)
		return (0);
	while (tokens->next)
		tokens = tokens->next;
	return (tokens->type == TOKEN_PIPE);
}
