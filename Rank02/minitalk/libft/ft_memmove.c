/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_memmove.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 14:52:16 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/28 17:39:59 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

void	*ft_memmove(void *dst, const void *src, size_t len)
{
	size_t				i;
	unsigned char		*dst_ptr;
	const unsigned char	*src_ptr;

	if (!dst && !src)
		return (NULL);
	i = 0;
	dst_ptr = (unsigned char *)dst;
	src_ptr = (const unsigned char *)src;
	if (dst_ptr == src_ptr || len == 0)
		return (dst);
	if (dst_ptr < src_ptr)
	{
		while (i < len)
		{
			dst_ptr[i] = src_ptr[i];
			i++;
		}
	}
	else
	{
		while (len-- > 0)
			dst_ptr[len] = src_ptr[len];
	}
	return (dst);
}
/*
TIL: Don't introduce a bug in your code by checking if an unsinged int is 
>= or == 0 as this will create an infinite loop because an unsigned int can 
never go below 0)
*/
