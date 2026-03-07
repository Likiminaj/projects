/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   push_swap.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/10 16:43:13 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "push_swap.h"

int	main(int argc, char **argv)
{
	t_stack	*stack_a;
	t_stack	*stack_b;

	stack_a = ft_build_stack(argc, argv);
	if (!stack_a)
		return (0);
	stack_b = malloc(sizeof(t_stack));
	if (!stack_b)
	{
		ft_fail(&stack_a);
		return (1);
	}
	stack_b->head = NULL;
	stack_b->tail = NULL;
	stack_b->size = 0;
	ft_sort_stack(stack_a, stack_b);
	ft_free(&stack_a);
	free(stack_b);
	return (0);
}
