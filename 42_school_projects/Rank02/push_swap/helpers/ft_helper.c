/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_helper.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:49:51 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 12:11:22 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

size_t	ft_space(int c)
{
	return (c == 32 || (c >= 9 && c <= 13));
}

t_node	*ft_last_node(t_node *head)
{
	if (!head)
		return (NULL);
	while (head->next != NULL)
		head = head->next;
	return (head);
}

void	ft_print_error(void)
{
	write(2, "Error\n", 6);
}

void	ft_fail(t_stack **stack)
{
	t_node	*tmp;

	ft_print_error();
	if (!stack || !*stack)
		return ;
	while ((*stack)->head)
	{
		tmp = (*stack)->head;
		(*stack)->head = (*stack)->head->next;
		free (tmp);
	}
	free (*stack);
	*stack = NULL;
}

void	ft_free(t_stack **stack)
{
	t_node	*tmp;

	if (!stack || !*stack)
		return ;
	while ((*stack)->head)
	{
		tmp = (*stack)->head;
		(*stack)->head = (*stack)->head->next;
		free (tmp);
	}
	free (*stack);
	*stack = NULL;
}
