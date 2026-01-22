/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_putnbru_fd_mod.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 13:09:47 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/21 10:53:02 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_putnbru_fd_mod(unsigned int i, int fd)
{
	long	nbr;
	char	c;
	int		bytes_printed;

	nbr = (long)i;
	bytes_printed = 0;
	if (nbr > 9)
		bytes_printed += ft_putnbru_fd_mod(nbr / 10, 1);
	c = (nbr % 10) + '0';
	bytes_printed += write(fd, &c, 1);
	return (bytes_printed);
}
