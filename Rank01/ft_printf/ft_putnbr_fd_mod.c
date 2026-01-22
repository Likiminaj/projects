/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_putnbr_fd_mod.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 13:00:57 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/14 13:26:17 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "ft_printf.h"

int	ft_putnbr_fd_mod(int i, int fd)
{
	long	nbr;
	int		bytes_printed;
	char	c;

	bytes_printed = 0;
	nbr = (long)i;
	if (nbr < 0)
	{
		nbr = -nbr;
		bytes_printed += write(fd, "-", 1);
	}
	if (nbr > 9)
	{
		bytes_printed += ft_putnbr_fd_mod(nbr / 10, fd);
	}
	c = nbr % 10 + '0';
	bytes_printed += write(fd, &c, 1);
	return (bytes_printed);
}
