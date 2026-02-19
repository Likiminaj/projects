/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_atoi.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/06/04 11:31:46 by cpesty            #+#    #+#             */
/*   Updated: 2025/06/04 12:11:57 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static int	ft_write(const char *str)
{
	long	b;
	long	final;

	b = 0;
	final = 0;
	while (str[b] >= '0' && str[b] <= '9')
	{
		final = final * 10 + (str[b] - '0');
		b++;
	}
	return (final);
}

int	ft_atoi(const char *nptr)
{
	long	minus;
	long	a;

	minus = 1;
	a = 0;
	while ((nptr[a] >= 9 && nptr[a] <= 13) || nptr[a] == 32)
		a++;
	if (nptr[a] == '-' || nptr[a] == '+')
	{
		if (nptr[a + 1] == '-' || nptr[a + 1] == '+')
			return (0);
		if (nptr[a] == '-')
		{
			minus = -1;
			a++;
		}
		else if (nptr[a] == '+')
			a++;
	}
	return (minus * ft_write(nptr + a));
}
