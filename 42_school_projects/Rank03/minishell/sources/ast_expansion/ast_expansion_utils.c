/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_utils.c                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/19 18:37:07 by cpesty            #+#    #+#             */
/*   Updated: 2026/03/20 18:53:39 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		dol_found(char *argument);
int		is_dol_only(char *argument);
int		ft_count_args(char **args);
int		char_is_valid(char c);

/* Counts number of dollar signs in a string for variable expansion check. */
int	dol_found(char *argument)
{
	int	i;
	int	count;

	i = 0;
	count = 0;
	while (argument[i] != '\0' && argument[i + 1] != '\0')
	{
		if (argument[i] == '$' || argument[i] == '\x03')
			count++;
		i++;
	}
	return (count);
}

/* Checks if string is a lone dollar sign with no variable name. */
int	is_dol_only(char *argument)
{
	if ((argument[0] == '$' || argument[0] == '\x03') && argument[1] == '\0')
		return (1);
	return (0);
}

/* Counts the number of non-NULL arguments in an args array. */
int	ft_count_args(char **args)
{
	int	i;

	i = 0;
	while (args[i])
		i++;
	return (i);
}

/* Validates if character is valid in variable
name (alphanumeric or underscore). */
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
