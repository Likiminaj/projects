/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isascii.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 11:31:58 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:18 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// isascii()
// checks whether c is a 7-bit unsigned char value that  fits  into
// the ASCII character set.
// The values returned are nonzero if the character c  falls  into  the  tested
// class, and zero if not.

#include "libft.h"

int	ft_isascii(int c)
{
	return ((c >= 0 && c <= 127));
}
