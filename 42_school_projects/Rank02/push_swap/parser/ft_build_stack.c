/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_build_stack.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/06 18:53:19 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/19 12:15:21 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

// prototype(s)
static size_t	ft_create_stack(int argc, char **argv, t_stack *stack);
static size_t	ft_create_nodes(char *str, t_stack *stack);
static size_t	ft_add_node(char *str, t_stack *stack, size_t srt, size_t end);
static long		ft_atoi_long(char *str, size_t start, size_t end);

t_stack	*ft_build_stack(int argc, char **argv)
{
	t_stack	*stack;
	size_t	count;

	if (argc == 1)
		return (NULL);
	count = ft_word_count_and_process(argc, argv);
	if (count == 0)
		return (ft_print_error(), NULL);
	stack = malloc(sizeof(t_stack));
	if (!stack)
		return (NULL);
	stack->head = NULL;
	stack->tail = NULL;
	stack->size = 0;
	if (!ft_create_stack(argc, argv, stack))
		return (ft_fail(&stack), NULL);
	if (stack->size != count || ft_dup(stack) || !ft_assign_rank(stack))
		return (ft_fail(&stack), NULL);
	if (ft_is_sorted(stack))
		return (ft_free(&stack), NULL);
	return (stack);
}

static size_t	ft_create_stack(int argc, char **argv, t_stack *stack)
{
	size_t	i;

	i = 1;
	while (i < (size_t)argc)
	{
		if (!ft_create_nodes(argv[i], stack))
			return (0);
		i++;
	}
	return (1);
}

static size_t	ft_create_nodes(char *str, t_stack *stack)
{
	size_t	i;
	size_t	start;

	i = 0;
	while (str[i])
	{
		while (str[i] && ft_space(str[i]))
			i++;
		if (str[i] && !ft_space(str[i]))
		{
			start = i;
			while (str[i] && !ft_space(str[i]))
				i++;
			if (!ft_add_node(str, stack, start, i))
				return (0);
			stack->size++;
		}
	}
	return (1);
}

static size_t	ft_add_node(char *str, t_stack *stack, size_t start, size_t end)
{
	long	digit;
	t_node	*new_node;

	new_node = malloc(sizeof(t_node));
	if (!new_node)
		return (0);
	digit = ft_atoi_long(str, start, end);
	if (digit == LONG_MAX)
		return (free(new_node), (0));
	new_node->number = (int)digit;
	new_node->next = NULL;
	new_node->rank = 0;
	if (!stack->head)
	{
		stack->head = new_node;
		stack->tail = new_node;
		new_node->prev = NULL;
	}
	else
	{
		stack->tail->next = new_node;
		new_node->prev = stack->tail;
		stack->tail = new_node;
	}
	return (1);
}

static long	ft_atoi_long(char *str, size_t start, size_t end)
{
	long	i;
	long	sign;
	long	result;

	i = start;
	sign = 1;
	result = 0;
	if (end - start > 11)
		return (LONG_MAX);
	if (str[i] == '-' || str[i] == '+')
	{
		if (str[i] == '-')
			sign = -1;
		i++;
	}
	while (i < (long)end)
	{
		result = (result * 10) + (str[i] - '0');
		i++;
	}
	result = result * sign;
	if (result < INT_MIN || result > INT_MAX)
		return (LONG_MAX);
	return (result);
}
