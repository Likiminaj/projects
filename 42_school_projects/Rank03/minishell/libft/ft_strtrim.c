/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strtrim.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/05 12:40:30 by cpesty            #+#    #+#             */
/*   Updated: 2025/08/26 12:50:28 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* allocate with malloc() and return a copy of s1 with the characters specified 
in set removed from the beginning and the end of the string */

#include "libft.h"

static	size_t	inset(char const letter, char const *set)
{
	size_t	i;

	i = 0;
	while (set[i] != '\0')
	{
		if (letter == set[i])
			return (1);
		i++;
	}
	return (0);
}

char	*ft_strtrim(char const *s1, char const *set)
{
	size_t	start;
	size_t	end;
	size_t	len;
	char	*trimmed;

	if (!s1 || !set)
		return (NULL);
	start = 0;
	while (s1[start] && inset(s1[start], set))
		start++;
	end = ft_strlen(s1);
	while (s1[end - 1] && inset(s1[end - 1], set))
		end--;
	if (end > start)
		len = end - start;
	else
		len = 0;
	trimmed = ft_substr(s1, (unsigned int)start, len);
	return (trimmed);
}
