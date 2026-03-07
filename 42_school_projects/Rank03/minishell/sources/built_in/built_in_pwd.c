/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_pwd.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:00:47 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/04 12:29:28 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	builtin_pwd(t_ast *ast, t_env *env);

/* Displays path of the current folder */
int	builtin_pwd(t_ast *ast, t_env *env)
{
	char	*current_path;

	(void) ast;
	(void) env;
	current_path = getcwd(NULL, 0);
	if (!current_path)
	{
		perror("minishell: pwd");
		return (1);
	}
	ft_printf("%s\n", current_path);
	free(current_path);
	return (0);
}
