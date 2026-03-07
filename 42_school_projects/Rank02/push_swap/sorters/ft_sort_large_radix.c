/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_sort_large_radix.c                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 15:51:59 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/19 12:42:09 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static int	ft_get_max_bits(t_stack *stack);

void	ft_sort_large(t_stack *stack_a, t_stack *stack_b)
{
	int	max_bits;
	int	bit;
	int	size;
	int	i;

	max_bits = ft_get_max_bits(stack_a);
	bit = 0;
	while (bit < max_bits)
	{
		size = stack_a->size;
		i = 0;
		while (i < size)
		{
			if (((stack_a->head->rank >> bit) & 1) == 0)
				ft_pb(stack_a, stack_b);
			else
				ft_ra(stack_a);
			i++;
		}
		while (stack_b->size > 0)
			ft_pa(stack_a, stack_b);
		bit++;
	}
}

static int	ft_get_max_bits(t_stack *stack)
{
	int	max_rank;
	int	bits;

	max_rank = stack->size - 1;
	bits = 0;
	while (max_rank > 0)
	{
		max_rank >>= 1;
		bits++;
	}
	return (bits);
}
