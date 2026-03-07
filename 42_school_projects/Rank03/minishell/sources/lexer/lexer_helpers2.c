/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer_helpers2.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/19 17:49:47 by lraghave          #+#    #+#             */
/*   Updated: 2026/02/26 16:35:14 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

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
