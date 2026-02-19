/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_substr.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/05 11:15:48 by cpesty            #+#    #+#             */
/*   Updated: 2025/08/26 12:50:39 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* allocate with malloc() and return a substring from string s (beginning 
at index start and of max. size len) */

#include "libft.h"

static char	*allocation(char const *s, char	*substr,
	unsigned int start, size_t len)
{
	size_t	i;

	i = 0;
	while (s[i + start] != '\0' && i < len)
	{
		substr[i] = s[i + start];
		i++;
	}
	substr[i] = '\0';
	return (substr);
}

char	*ft_substr(char const *s, unsigned int start, size_t len)
{
	char	*substr;
	size_t	final_len;

	if (!s)
		return (NULL);
	if (ft_strlen(s) <= start)
	{
		substr = malloc (1);
		if (!substr)
			return (NULL);
		substr[0] = '\0';
		return (substr);
	}
	final_len = ft_strlen(s + start);
	if (final_len < len)
		len = final_len;
	substr = malloc((len + 1) * sizeof(char));
	if (!substr)
		return (NULL);
	allocation(s, substr, start, len);
	return (substr);
}
