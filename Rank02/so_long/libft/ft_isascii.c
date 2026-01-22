/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isascii.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:33:23 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/21 20:31:14 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_isascii(int c)
{
	return (c >= 0 && c <= 127);
}

/*
#include <stdio.h>

int main(void)
{
    printf("A: %d\n", ft_isascii('A')); // 1
    printf("z: %d\n", ft_isascii('z')); // 1
    printf("5: %d\n", ft_isascii('5')); // 0
    printf("#: %d\n", ft_isascii('#')); // 0
    return 0;
}
*/
