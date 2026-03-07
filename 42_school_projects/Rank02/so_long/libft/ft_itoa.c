/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_itoa.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:49:13 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/24 15:42:55 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

// Protoypes
static int	ft_numlen(int n);

char	*ft_itoa(int n)
{
	int		len;
	char	*value;
	long	num;

	len = ft_numlen(n);
	value = malloc(len + 1);
	if (!value)
		return (NULL);
	value[len] = '\0';
	num = (long)n;
	if (num == 0)
		value[0] = '0';
	if (num < 0)
	{
		value[0] = '-';
		num *= -1;
	}
	while (num > 0)
	{
		value[--len] = (num % 10) + '0';
		num /= 10;
	}
	return (value);
}

// TIL: You can use boolean expressions to assign integers
// If n is <= 0 evaluates true so len = 1 
// If n > 0 evaluates false so len = 0
static int	ft_numlen(int n)
{
	int	len;

	len = (n <= 0);
	while (n)
	{
		n /= 10;
		len++;
	}
	return (len);
}
