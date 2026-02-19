/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strdup.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/04 14:49:03 by cpesty            #+#    #+#             */
/*   Updated: 2025/08/13 15:44:05 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Duplicate a string

#include "libft.h"

char	*ft_strdup(const char *s)
{
	char	*str;
	int		s_length;
	int		n;

	s_length = 0;
	while (s[s_length] != '\0')
		s_length++;
	str = malloc(s_length + 1);
	if (!str)
		return (NULL);
	n = 0;
	while (s[n] != '\0')
	{
		str[n] = s[n];
		n++;
	}
	str[n] = '\0';
	return (str);
}
