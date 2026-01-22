/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_putstr_fd_mod.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 13:02:17 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/16 14:13:43 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "ft_printf.h"

int	ft_putstr_fd_mod(char *c, int fd)
{
	int	i;
	int	bytes_printed;

	i = 0;
	bytes_printed = 0;
	if (!c)
		bytes_printed += write(fd, "(null)", 6);
	else
	{
		while (c[i])
		{
			bytes_printed += write(fd, &c[i], 1);
			i++;
		}
	}
	return (bytes_printed);
}
