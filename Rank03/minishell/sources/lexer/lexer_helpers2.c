/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer_helpers2.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/19 17:49:47 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/19 19:16:57 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	ft_copy_quoted_text(char *word, char quote, int *i, char *clean)
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
