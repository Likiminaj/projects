/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_sort_small.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 15:51:59 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/19 12:34:54 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static void	ft_move_to_top(t_stack *stack, int position, char stack_name);

void	ft_sort_small(t_stack *stack_a, t_stack *stack_b)
{
	int		position;
	int		target_rank;
	t_node	*current;

	target_rank = 0;
	while (stack_a->size > 3)
	{
		current = stack_a->head;
		position = 0;
		while (current)
		{
			if (current->rank == target_rank)
			{
				ft_move_to_top(stack_a, position, 'a');
				ft_pb(stack_a, stack_b);
				target_rank++;
				break ;
			}
			position++;
			current = current-> next;
		}
	}
	ft_sort_three(stack_a);
	while (stack_b->size > 0)
		ft_pa(stack_a, stack_b);
}

static void	ft_move_to_top(t_stack *stack, int position, char stack_name)
{
	int	middle;

	middle = stack->size / 2;
	if (position <= middle)
	{
		while (position > 0)
		{
			if (stack_name == 'a')
				ft_ra(stack);
			else
				ft_rb(stack);
			position--;
		}
	}
	else
	{
		while (position < (int)stack->size)
		{
			if (stack_name == 'a')
				ft_rra(stack);
			else
				ft_rrb(stack);
			position++;
		}
	}
}
