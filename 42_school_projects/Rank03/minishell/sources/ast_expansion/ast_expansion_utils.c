/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_utils.c                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/19 18:37:07 by cpesty            #+#    #+#             */
/*   Updated: 2026/02/11 16:44:35 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		dol_found(char *argument);
int		is_dol_only(char *argument);
int		char_is_valid(char c);

int	dol_found(char *argument)
{
	int	i;
	int	count;

	i = 0;
	count = 0;
	while (argument[i] != '\0' && argument[i + 1] != '\0')
	{
		if (argument[i] == '$')
			count++;
		i++;
	}
	return (count);
}

int	is_dol_only(char *argument)
{
	if (argument[0] == '$' && argument[1] == '\0')
		return (1);
	return (0);
}

int	char_is_valid(char c)
{
	if (c == '\0')
		return (0);
	if (!(((c >= 'a') && (c <= 'z'))
			|| ((c >= 'A') && (c <= 'Z'))
			|| (c == '_')
			|| ((c >= '0') && (c <= '9'))))
		return (0);
	return (1);
}
