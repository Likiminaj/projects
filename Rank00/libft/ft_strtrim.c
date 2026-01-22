/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strtrim.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:49:13 by lraghave          #+#    #+#             */
/*   Updated: 2025/06/02 16:30:50 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

// Prototype
static int	ft_inset(char const c, char const *set);

char	*ft_strtrim(char const *s1, char const *set)
{
	int		ptr_len;
	int		start;
	int		end;
	char	*ptr;

	if (!s1 || !set)
		return (NULL);
	start = 0;
	while (s1[start] && ft_inset(s1[start], set))
		start++;
	end = (int)ft_strlen(s1) - 1;
	while (end >= start && ft_inset(s1[end], set))
		end--;
	ptr_len = end - start + 1;
	if (ptr_len < 0)
		ptr_len = 0;
	ptr = ft_substr(s1, start, ptr_len);
	if (!ptr)
		return (NULL);
	return (ptr);
}

static int	ft_inset(char const c, char const *set)
{
	size_t	i;

	i = 0;
	while (set[i])
	{
		if (set[i] == c)
			return (1);
		i++;
	}
	return (0);
}
