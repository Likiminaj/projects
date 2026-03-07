/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isdigit.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 11:31:58 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:20 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// isdigit()
// checks for a digit (0 through 9).
// RETURN VALUE
// The values returned are nonzero if the character c  falls  into  the  tested
// class, and zero if not.

#include "libft.h"

int	ft_isdigit(int c)
{
	return ((c >= '0' && c <= '9'));
}
