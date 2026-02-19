/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isprint.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 11:31:58 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:24 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// isprint()
// checks for any printable character including space.
// The values returned are nonzero if the character c  falls  into  the  tested
// class, and zero if not.

#include "libft.h"

int	ft_isprint(int c)
{
	return ((c >= 32 && c <= 126));
}
