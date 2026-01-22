/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_puthexl_fd_mod.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 12:27:46 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/21 10:52:00 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_puthexl_fd_mod(unsigned int i, int fd)
{
	int				bytes_printed;
	char			*radix;
	unsigned int	index;

	radix = "0123456789abcdef";
	bytes_printed = 0;
	if (i >= 16)
		bytes_printed += ft_puthexl_fd_mod(i / 16, fd);
	index = i % 16;
	bytes_printed += write(fd, &radix[index], 1);
	return (bytes_printed);
}
