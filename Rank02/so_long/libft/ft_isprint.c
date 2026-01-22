/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isprint.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/10 18:33:23 by lraghave          #+#    #+#             */
/*   Updated: 2025/05/21 20:32:32 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "libft.h"

int	ft_isprint(int c)
{
	return (c >= 32 && c <= 126);
}

/*
#include <stdio.h>

int main(void)
{
    printf("A: %d\n", ft_isprint('A')); 
    printf("z: %d\n", ft_isprint('z'));
    printf("5: %d\n", ft_isprint('5'));
    printf("#: %d\n", ft_isprint('#'));
    printf("DEL: %d\n", ft_isprint(0));
    return 0;
}
*/
