/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_echo.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:00:50 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/03 14:32:52 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		builtin_echo(t_ast *ast);
int		check_n(char *argument, int *no_new_line);
void	exec_echo(char *argument, int *space);

/* Prints its arguments to standard output, separated by spaces,
optionally suppressing the final newline with -n. */
int	builtin_echo(t_ast *ast)
{
	int	i;
	int	space;
	int	no_new_line;

	i = 1;
	no_new_line = 0;
	space = 0;
	while (ast->args[i] && check_n(ast->args[i], &no_new_line) == 1)
		i++;
	while (ast->args[i] != NULL)
	{
		if (space == 1)
			write(1, " ", 1);
		exec_echo(ast->args[i], &space);
		i++;
	}
	if (no_new_line == 0)
		ft_printf("\n");
	return (0);
}

/* Checks if the given argument is -n or -nnn etc. */
int	check_n(char *argument, int *no_new_line)
{
	int	i;

	i = 1;
	if (argument[0] != '-' || argument[1] == '\0')
		return (0);
	while (argument[i] == 'n')
		i++;
	if (argument[i] == '\0')
	{
		*no_new_line = 1;
		return (1);
	}
	else
		return (0);
}

/* Prints the given argument. */
void	exec_echo(char *argument, int *space)
{
	write(1, argument, ft_strlen(argument));
	*space = 1;
}
