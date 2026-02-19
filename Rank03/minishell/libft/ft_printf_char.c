/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_char.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/17 16:52:55 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:38:22 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	with_left_justified(t_flags *flags, char c)
{
	int		counter;

	counter = 0;
	flags->fin_len += write(1, &c, 1);
	while (counter < ((flags->width) - 1))
	{
		flags->fin_len += write(1, " ", 1);
		counter++;
	}
}

static void	without_left_justified(t_flags *flags, char c)
{
	int		counter;

	counter = 0;
	while (counter < ((flags->width) - 1))
	{
		flags->fin_len += write(1, " ", 1);
		counter++;
	}
	flags->fin_len += write(1, &c, 1);
}

void	ft_print_char(t_flags *flags)
{
	char	c;

	c = va_arg(flags->args, int);
	if (flags->width > 0)
	{
		if (flags->left_justified == 0)
			without_left_justified(flags, c);
		else
			with_left_justified(flags, c);
	}
	else
		flags->fin_len += write(1, &c, 1);
}
