/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_putadd_fd_mod.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 12:19:46 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/15 12:45:38 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "ft_printf.h"

// Prototypes
static int	ft_puthex_long_fd_mod(unsigned long addr, int fd);

int	ft_putadd_fd_mod(void *ptr, int fd)
{
	int				bytes_printed;
	unsigned long	addr;

	if (!ptr)
		return (write(fd, "(nil)", 5));
	bytes_printed = 0;
	addr = (unsigned long)ptr;
	bytes_printed += write(fd, "0x", 2);
	bytes_printed += ft_puthex_long_fd_mod(addr, fd);
	return (bytes_printed);
}

static int	ft_puthex_long_fd_mod(unsigned long addr, int fd)
{
	int		bytes_printed;
	int		index;
	char	*radix;

	bytes_printed = 0;
	radix = "0123456789abcdef";
	if (addr >= 16)
		bytes_printed += ft_puthex_long_fd_mod(addr / 16, fd);
	index = addr % 16;
	bytes_printed += write(fd, &radix[index], 1);
	return (bytes_printed);
}
