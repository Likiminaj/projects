/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strrchr.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/04 16:34:43 by cpesty            #+#    #+#             */
/*   Updated: 2025/06/04 16:36:01 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// The strrchr() function returns a pointer to the last 
// occurrence of the character c in the string s.

#include "libft.h"

char	*ft_strrchr(const char *s, int c)
{
	int	count;

	count = 0;
	while (s[count] != '\0')
		count++;
	if ((char)c == '\0')
		return ((char *)&s[count]);
	while (count > 0)
	{
		count--;
		if (s[count] == (char)c)
			return ((char *)&s[count]);
	}
	return (NULL);
}
