/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_get_next_utils.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/08/12 15:33:41 by cpesty            #+#    #+#             */
/*   Updated: 2025/10/29 18:47:27 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

/* Checks if a new line can be found in our stash.
no = 0
yes = 1 */

int	found_newline(char *stash)
{
	int	i;

	if (stash == NULL)
		return (0);
	i = 0;
	while (stash[i] != '\0')
	{
		if (stash[i] == '\n')
			return (1);
		i++;
	}
	return (0);
}

/* Calculates line lenght via stash info and allocates 
   memory accordingly */

void	create_line(char **line, char *stash)
{
	int	len;

	len = 0;
	while (stash[len] != '\0' && stash[len] != '\n')
		len++;
	if (stash[len] == '\n')
		len++;
	*line = malloc(len + 1);
	if (!(*line))
		return ;
}

/* Calculates the lenght of a string */

int	ft_strlen_gnl(const char *s)
{
	int	count;

	count = 0;
	while (*s)
	{
		count++;
		s++;
	}
	return (count);
}

void	free_stash(char **stash)
{
	free(*stash);
	*stash = NULL;
}
