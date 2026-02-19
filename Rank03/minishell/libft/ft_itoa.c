/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_itoa.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/06 15:11:19 by cpesty            #+#    #+#             */
/*   Updated: 2025/08/26 12:49:14 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* allocate with malloc() and return a string representing the integer 
(positive, zero or negative) received as an argument */

#include "libft.h"

int	counter(int nb)
{
	int		digit_count;
	long	m;

	digit_count = 0;
	m = (long)nb;
	if (nb < 0)
	{
		digit_count++;
		m = -m;
	}
	while (m != 0)
	{
		digit_count++;
		m = m / 10;
	}
	return (digit_count);
}

char	*ft_itoa(int n)
{
	int		digit_count;
	long	m;
	int		i;
	char	*into_char;

	if (n == 0)
		return (ft_strdup("0"));
	digit_count = counter(n);
	into_char = malloc((digit_count + 1) * sizeof(char));
	if (!into_char)
		return (NULL);
	into_char[digit_count] = '\0';
	i = digit_count - 1;
	m = (long)n;
	if (n < 0)
		m = -m;
	while (m != 0 && i >= 0)
	{
		into_char[i] = m % 10 + '0';
		i--;
		m = m / 10;
	}
	if (n < 0)
		into_char[i] = '-';
	return (into_char);
}
