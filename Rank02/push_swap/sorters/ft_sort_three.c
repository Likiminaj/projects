/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_sort_three.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 15:51:59 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 16:31:50 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

void	ft_sort_three(t_stack *stack_a)
{
	int	a;
	int	b;
	int	c;

	a = stack_a->head->rank;
	b = stack_a->head->next->rank;
	c = stack_a->head->next->next->rank;
	if (a > b && b < c && a < c)
		ft_sa(stack_a);
	else if (a > b && b > c)
	{
		ft_sa(stack_a);
		ft_rra(stack_a);
	}
	else if (a > b && b < c && a > c)
		ft_ra(stack_a);
	else if (a < b && b > c && a < c)
	{
		ft_sa(stack_a);
		ft_ra(stack_a);
	}
	else if (a < b && b > c && a > c)
		ft_rra(stack_a);
}
